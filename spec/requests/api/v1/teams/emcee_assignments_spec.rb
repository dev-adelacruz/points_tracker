# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Teams::EmceeAssignments" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee1) { create(:user, :emcee) }
  let(:emcee2) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team) { create(:team) }

  describe "#show" do
    path "/api/v1/teams/{team_id}/emcee_assignment" do
      parameter name: :team_id, in: :path, type: :integer

      get "returns the current emcee assignment for a team" do
        tags "Teams::EmceeAssignments"
        produces "application/json"

        response(200, "returns active emcee assignment") do
          let(:team_id) { team.id }

          before do
            create(:team_emcee_assignment, team: team, user: emcee1, active: true)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:emcee_id]).to eq(emcee1.id)
            expect(json_response[:data][:emcee_email]).to eq(emcee1.email)
          end
        end

        response(404, "returns not found when no active assignment") do
          let(:team_id) { team.id }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(403, "returns forbidden for non-admin") do
          let(:team_id) { team.id }

          before { sign_in emcee1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#update" do
    path "/api/v1/teams/{team_id}/emcee_assignment" do
      parameter name: :team_id, in: :path, type: :integer

      patch "assigns an emcee to a team" do
        tags "Teams::EmceeAssignments"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: { user_id: { type: :integer } },
          required: [ "user_id" ]
        }

        response(200, "assigns emcee to team") do
          let(:team_id) { team.id }
          let(:params) { { user_id: emcee1.id } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:emcee_id]).to eq(emcee1.id)
            expect(team.reload.current_emcee).to eq(emcee1)
          end
        end

        response(200, "reassigns emcee and deactivates previous assignment") do
          let(:team_id) { team.id }
          let(:params) { { user_id: emcee2.id } }

          before do
            create(:team_emcee_assignment, team: team, user: emcee1, active: true)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:emcee_id]).to eq(emcee2.id)
            expect(team.reload.current_emcee).to eq(emcee2)
          end
        end

        response(422, "returns error when user is not an emcee") do
          let(:team_id) { team.id }
          let(:params) { { user_id: host.id } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(403, "returns forbidden for non-admin") do
          let(:team_id) { team.id }
          let(:params) { { user_id: emcee1.id } }

          before { sign_in emcee1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#destroy" do
    path "/api/v1/teams/{team_id}/emcee_assignment" do
      parameter name: :team_id, in: :path, type: :integer

      delete "unassigns the current emcee from a team" do
        tags "Teams::EmceeAssignments"
        produces "application/json"

        response(200, "unassigns emcee from team") do
          let(:team_id) { team.id }

          before do
            create(:team_emcee_assignment, team: team, user: emcee1, active: true)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(team.reload.current_emcee).to be_nil
          end
        end

        response(404, "returns not found when no active assignment") do
          let(:team_id) { team.id }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end
      end
    end
  end
end
