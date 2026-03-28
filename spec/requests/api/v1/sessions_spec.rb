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

          before { sign_in emcee }

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

  describe "#index filters" do
    let(:team2) { create(:team) }
    let(:other_emcee) { create(:user, :emcee) }

    before do
      create(:session, team: team, created_by: emcee, date: Date.current)
      create(:session, team: team2, created_by: other_emcee, date: 1.month.ago.to_date)
      sign_in admin
    end

    path "/api/v1/sessions" do
      get "filters by team_id" do
        tags "Sessions"
        produces "application/json"
        parameter name: :team_id, in: :query, type: :integer, required: false

        response(200, "returns sessions for the specified team") do
          let(:team_id) { team.id }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:team_id]).to eq(team.id)
          end
        end
      end

      get "filters by date range" do
        tags "Sessions"
        produces "application/json"
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false

        response(200, "returns sessions within the date range") do
          let(:date_from) { 2.months.ago.to_date.to_s }
          let(:date_to) { 2.weeks.ago.to_date.to_s }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:team_id]).to eq(team2.id)
          end
        end
      end

      get "filters by emcee_id" do
        tags "Sessions"
        produces "application/json"
        parameter name: :emcee_id, in: :query, type: :integer, required: false

        response(200, "returns sessions created by the specified emcee") do
          let(:emcee_id) { emcee.id }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:created_by_id]).to eq(emcee.id)
          end
        end
      end
    end
  end

  describe "#update" do
    let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

    path "/api/v1/sessions/{id}" do
      parameter name: :id, in: :path, type: :integer

      patch "updates a session" do
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
                session_slot: { type: :string, enum: [ "first", "second" ] }
              }
            },
            host_ids: { type: :array, items: { type: :integer } }
          }
        }

        response(200, "admin can update session date and hosts") do
          let(:id) { session.id }
          let(:params) { { session: { date: 1.day.ago.to_date.to_s, session_slot: "second" }, host_ids: [ host1.id ] } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:session_slot]).to eq("second")
            expect(json_response[:data][:host_ids]).to include(host1.id)
          end
        end

        response(403, "emcee cannot update sessions") do
          let(:id) { session.id }
          let(:params) { { session: { date: 1.day.ago.to_date.to_s } } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(404, "returns not found for missing session") do
          let(:id) { 0 }
          let(:params) { { session: { date: Date.current.to_s } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end
      end
    end
  end

  describe "#destroy" do
    let!(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

    path "/api/v1/sessions/{id}" do
      parameter name: :id, in: :path, type: :integer

      delete "deletes a session" do
        tags "Sessions"
        produces "application/json"

        response(200, "admin can delete a session and its coin entries") do
          let(:id) { session.id }

          before do
            create(:coin_entry, session: session, user: host1, coins: 5_000)
            session.session_hosts.create!(user: host1)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(Session.exists?(session.id)).to be false
            expect(CoinEntry.where(session_id: session.id).count).to eq(0)
          end
        end

        response(403, "emcee cannot delete sessions") do
          let(:id) { session.id }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
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
