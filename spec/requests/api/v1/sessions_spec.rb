# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Sessions" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:team) { create(:team) }

  before do
    create(:team_membership, user: emcee, team: team)
  end

  describe "#index" do
    path "/api/v1/sessions" do
      get "lists sessions scoped to current user" do
        tags "Sessions"
        produces "application/json"

        response(200, "returns all sessions for admin") do
          before do
            create(:session, team: team, created_by: emcee, date: Date.current)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
          end
        end

        response(200, "returns only team sessions for emcee") do
          let(:other_team) { create(:team) }

          before do
            create(:session, team: team, created_by: emcee, date: Date.current)
            other_emcee = create(:user, :emcee)
            create(:session, team: other_team, created_by: other_emcee, date: Date.current)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:team_id]).to eq(team.id)
          end
        end

        response(403, "returns forbidden for host") do
          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end

  describe "#create" do
    path "/api/v1/sessions" do
      post "creates a new session" do
        tags "Sessions"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            session: {
              type: :object,
              properties: {
                date: { type: :string, format: :date },
                session_slot: { type: :string, enum: [ "first", "second" ] },
                team_id: { type: :integer }
              },
              required: [ "date", "session_slot", "team_id" ]
            },
            host_ids: { type: :array, items: { type: :integer } }
          }
        }

        response(201, "creates session for emcee") do
          let(:params) { { session: { date: Date.current.to_s, session_slot: "first", team_id: team.id }, host_ids: [ host1.id ] } }

          before do
            create(:team_membership, user: host1, team: team)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data][:team_id]).to eq(team.id)
            expect(json_response[:data][:session_slot]).to eq("first")
            expect(json_response[:data][:host_ids]).to include(host1.id)
          end
        end

        response(201, "creates session for admin") do
          let(:params) { { session: { date: Date.current.to_s, session_slot: "second", team_id: team.id }, host_ids: [] } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data][:session_slot]).to eq("second")
          end
        end

        response(201, "excludes hosts not belonging to the session team") do
          let(:other_team) { create(:team) }
          let(:other_host) { create(:user, :host) }

          before do
            create(:team_membership, user: host1, team: team)
            create(:team_membership, user: other_host, team: other_team)
            sign_in emcee
          end

          let(:params) do
            { session: { date: Date.current.to_s, session_slot: "first", team_id: team.id }, host_ids: [ host1.id, other_host.id ] }
          end

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data][:host_ids]).to include(host1.id)
            expect(json_response[:data][:host_ids]).not_to include(other_host.id)
          end
        end

        response(422, "rejects a future date") do
          let(:params) { { session: { date: (Date.current + 1).to_s, session_slot: "first", team_id: team.id }, host_ids: [] } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(422, "rejects duplicate date/slot/team combination") do
          let(:params) { { session: { date: Date.current.to_s, session_slot: "first", team_id: team.id }, host_ids: [] } }

          before do
            create(:session, team: team, created_by: emcee, date: Date.current, session_slot: :slot_one)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(403, "returns forbidden for host") do
          let(:params) { { session: { date: Date.current.to_s, session_slot: "first", team_id: team.id }, host_ids: [] } }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          let(:params) { { session: { date: Date.current.to_s, session_slot: "first", team_id: team.id }, host_ids: [] } }

          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end

  describe "#show" do
    path "/api/v1/sessions/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "returns a specific session" do
        tags "Sessions"
        produces "application/json"

        response(200, "returns session for admin") do
          let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }
          let(:id) { session.id }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:id]).to eq(session.id)
            expect(json_response[:data][:team_name]).to eq(team.name)
          end
        end

        response(404, "returns not found for missing session") do
          let(:id) { 0 }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end
      end
    end
  end
end
